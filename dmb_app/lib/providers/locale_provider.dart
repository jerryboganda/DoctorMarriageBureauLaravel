import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_provider.dart';

class LocaleState {
  final Locale locale;
  final TextDirection textDirection;

  const LocaleState({
    this.locale = const Locale('en'),
    this.textDirection = TextDirection.ltr,
  });

  bool get isUrdu => locale.languageCode == 'ur';
  String get languageCode => locale.languageCode;
}

class LocaleNotifier extends StateNotifier<LocaleState> {
  final Ref _ref;

  LocaleNotifier(this._ref) : super(const LocaleState()) {
    _loadSavedLocale();
  }

  Future<void> _loadSavedLocale() async {
    final api = _ref.read(apiServiceProvider);
    final lang = await api.getLanguage();
    _setLocale(lang);
  }

  Future<void> toggleLanguage() async {
    final newLang = state.isUrdu ? 'en' : 'ur';
    final api = _ref.read(apiServiceProvider);
    await api.setLanguage(newLang);
    _setLocale(newLang);
  }

  Future<void> setLanguage(String lang) async {
    final api = _ref.read(apiServiceProvider);
    await api.setLanguage(lang);
    _setLocale(lang);
  }

  void _setLocale(String lang) {
    state = LocaleState(
      locale: Locale(lang),
      textDirection: lang == 'ur' ? TextDirection.rtl : TextDirection.ltr,
    );
  }
}

final localeProvider = StateNotifierProvider<LocaleNotifier, LocaleState>((ref) {
  return LocaleNotifier(ref);
});
